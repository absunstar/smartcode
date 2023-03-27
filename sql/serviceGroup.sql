/****** Script for SelectTopNRows command from SSMS  ******/
SELECT TOP (1000) [ID]
      ,[Code]
      ,[EngName] as nameEn
      ,[ArbName] as nameAr
      ,[ServiceGroupType]
  FROM [hmis].[dbo].[ServiceGroups]