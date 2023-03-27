/****** Script for SelectTopNRows command from SSMS  ******/
SELECT TOP (1000) 
      [Code] as code
      ,[EngName] as nameEn
	  ,[EngName] as nameAr
  FROM [hmis].[dbo].[ServiceDosageRoutes]